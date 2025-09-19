# OneOrder财务清分系统 Dockerfile
FROM openjdk:11-jre-slim

# 设置环境变量
ENV APP_HOME=/app
ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=docker

# 创建应用目录
WORKDIR $APP_HOME

# 创建应用用户（安全性考虑）
RUN groupadd -r oneorder && useradd -r -g oneorder oneorder

# 复制应用程序
COPY target/oneorder-clearing-system-*.jar $APP_HOME/app.jar
COPY src/main/resources/application*.yml $APP_HOME/config/

# 创建日志目录
RUN mkdir -p $APP_HOME/logs && \
    chown -R oneorder:oneorder $APP_HOME

# 切换到应用用户
USER oneorder

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar $APP_HOME/app.jar --spring.config.location=classpath:/application.yml,file:$APP_HOME/config/application-docker.yml"]